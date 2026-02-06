const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const os = require('os');

admin.initializeApp();

const isWin = os.platform() === 'win32';
const YTDLP_URL = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const YTDLP_PATH = path.join(os.tmpdir(), isWin ? 'yt-dlp.exe' : 'yt-dlp');

async function ensureYtDlp() {
    if (fs.existsSync(YTDLP_PATH)) {
        return YTDLP_PATH;
    }

    console.log('Downloading yt-dlp...');
    const response = await axios({
        method: 'get',
        url: YTDLP_URL,
        responseType: 'stream'
    });

    const writer = fs.createWriteStream(YTDLP_PATH);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            writer.close();
            if (!isWin) fs.chmodSync(YTDLP_PATH, '755');
            resolve(YTDLP_PATH);
        });
        writer.on('error', (err) => {
            fs.unlink(YTDLP_PATH, () => reject(err));
        });
    });
}

exports.convertVideo = functions.runWith({
    timeoutSeconds: 540,
    memory: '2GB',
    enforceAppCheck: false // Disable for local testing ease
}).https.onCall(async (data, context) => {
    const { url } = data;

    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'URL is required');
    }

    try {
        const ytDlpPath = await ensureYtDlp();

        // 1. Validation: Check video duration first
        const durationCmd = `"${ytDlpPath}" --get-duration "${url}"`;
        let durationStr = '';
        try {
            durationStr = execSync(durationCmd).toString().trim();
        } catch (e) {
            throw new functions.https.HttpsError('invalid-argument', 'Could not fetch video metadata. Check the URL.');
        }

        // Parse duration (could be HH:MM:SS or MM:SS)
        const parts = durationStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else seconds = parts[0];

        if (seconds > 600) { // 10 minutes limit
            throw new functions.https.HttpsError('out-of-range', 'Video is too long. Maximum duration is 10 minutes.');
        }

        const tmpDir = path.join(os.tmpdir(), `convert_${Date.now()}`);
        await fs.ensureDir(tmpDir);

        const outputTemplate = path.join(tmpDir, '%(title)s.%(ext)s');

        // Detect FFmpeg path for local testing (Windows)
        let ffmpegLoc = '';
        if (os.platform() === 'win32') {
            const possiblePaths = [
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                path.join(process.env.USERPROFILE || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
            ];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    ffmpegLoc = `--ffmpeg-location "${p}"`;
                    console.log(`Using local FFmpeg at: ${p}`);
                    break;
                }
            }
        }

        // Conversion command with progress flag
        const convertCmd = `"${ytDlpPath}" ${ffmpegLoc} -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata --newline --output "${outputTemplate}" --postprocessor-args "ffmpeg:-b:a 320k" "${url}"`;

        await new Promise((resolve, reject) => {
            const process = exec(convertCmd);

            process.stdout.on('data', (data) => {
                // Log progress to server console for monitoring
                console.log(data.toString().trim());
            });

            process.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`Process exited with code ${code}`));
            });
        });

        const files = await fs.readdir(tmpDir);
        const mp3File = files.find(f => f.endsWith('.mp3'));

        if (!mp3File) {
            throw new Error('MP3 file not found after conversion');
        }

        const filePath = path.join(tmpDir, mp3File);
        const fileBuffer = await fs.readFile(filePath);
        const base64Audio = fileBuffer.toString('base64');

        // Cleanup
        await fs.remove(tmpDir);

        return {
            success: true,
            audioData: base64Audio,
            fileName: mp3File
        };

    } catch (error) {
        console.error('FATAL CONVERSION ERROR:', {
            message: error.message,
            stack: error.stack,
            url: url
        });
        throw new functions.https.HttpsError('internal', `Expansion Engine Failure: ${error.message}`);
    }
});
