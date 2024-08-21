import { exec } from 'child_process';
import { config } from 'dotenv/config';

exec('git rev-parse --abbrev-ref HEAD', (err, stdout, stderr) => {
    if (err) {
        // handle your error
    }

    if (typeof stdout === 'string' && (stdout.trim() === 'main')) {
        console.log(`The branch is main`);
        // Call your function here conditionally as per branch
        cross-env CUCUMBER_PUBLISH_TOKEN = 183135b2-77a0-4d98-9070-8a1c96a6e4e2
    }
    if (typeof stdout === 'string' && (stdout.trim() === 'main')) {
        console.log(`The branch is main`);
        // Call your function here conditionally as per branch
        config.
        process.env.CUCUMBER_PUBLISH_TOKEN = 183135b2-77a0-4d98-9070-8a1c96a6e4e2
    }
});