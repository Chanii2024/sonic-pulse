const express = require('express');
const cors = require('cors');
const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const os = require('os');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 7860;
const isWin = os.platform() === 'win32';

// yt-dlp Setup
const YTDLP_URL = isWin
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const YTDLP_PATH = path.join(os.tmpdir(), isWin ? 'yt-dlp.exe' : 'yt-dlp');

async function ensureYtDlp() {
    if (isWin) {
        if (await fs.pathExists(YTDLP_PATH)) {
            return YTDLP_PATH;
        }

        console.log('Downloading yt-dlp for local Windows use...');
        const response = await axios({
            method: 'get',
            url: YTDLP_URL,
            responseType: 'stream'
        });

        await fs.ensureDir(path.dirname(YTDLP_PATH));
        const writer = fs.createWriteStream(YTDLP_PATH);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        return YTDLP_PATH;
    }

    // Non-Windows: prefer global binary.
    return 'yt-dlp';
}

// Routes
app.get('/', (req, res) => {
    res.send('Sonic Pulse Conversion Engine is Online 🚀');
});

app.post('/convertVideo', async (req, res) => {
    // Support both plain REST body and wrapped `data` payload.
    const url = req.body.data ? req.body.data.url : req.body.url;

    console.log('Received request for:', url);

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    // Normalize shorthand URLs to full domains and strip tracking params
    let normalizedUrl = url;
    if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
        normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('youtube.com/watch')) {
        const videoId = new URL(url).searchParams.get('v');
        normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    try {
        const ytDlpPath = await ensureYtDlp();

        // 1. Validation: Check duration
        const durationCmd = `"${ytDlpPath}" --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --get-duration "${normalizedUrl}"`;
        let durationStr = '';
        try {
            durationStr = execSync(durationCmd).toString().trim();
        } catch (e) {
            console.error('Metadata error:', e.stderr?.toString() || e.message);
            return res.status(400).json({
                error: 'Could not fetch video metadata.',
                details: e.stderr?.toString() || e.message
            });
        }

        const parts = durationStr.split(':').map(Number);
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        else seconds = parts[0];

        if (seconds > 600) {
            return res.status(400).json({ error: 'Video is too long. Maximum duration is 10 minutes.' });
        }

        const tmpDir = path.join(os.tmpdir(), `convert_${Date.now()}`);
        await fs.ensureDir(tmpDir);
        const outputTemplate = path.join(tmpDir, '%(title)s.%(ext)s');

        // Detect FFmpeg on local Windows fallback path.
        let ffmpegLoc = '';
        if (isWin) {
            const possiblePaths = [
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                path.join(process.env.USERPROFILE || '', 'ffmpeg', 'bin', 'ffmpeg.exe'),
            ];
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    ffmpegLoc = `--ffmpeg-location "${p}"`;
                    break;
                }
            }
        }

        // Conversion Command
        const convertCmd = `"${ytDlpPath}" --no-check-certificate --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" ${ffmpegLoc} -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --newline --output "${outputTemplate}" --postprocessor-args "ffmpeg:-b:a 320k" "${normalizedUrl}"`;

        await new Promise((resolve, reject) => {
            const process = exec(convertCmd);
            process.stdout.on('data', (data) => console.log(data.toString().trim()));
            process.stderr.on('data', (data) => console.error(data.toString().trim()));
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

        await fs.remove(tmpDir);

        // Return standard JSON payload expected by local frontend.
        res.json({
            success: true,
            audioData: base64Audio,
            fileName: mp3File
        });

    } catch (error) {
        console.error('FATAL ERROR:', error);
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
