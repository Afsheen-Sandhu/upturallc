export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { action } = req.query;
    const { email, password, token } = req.body;

    // Load credentials from environment variables (recommended) or use defaults
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@uptura.net';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'qamaruptura12!';

    // This is a simple static token. In a full production env, you'd use JWT or a session store.
    const AUTH_TOKEN = process.env.AUTH_TOKEN || 'uptura_admin_session_v1';

    if (action === 'login') {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            return res.status(200).json({
                success: true,
                token: AUTH_TOKEN,
                message: 'Login successful'
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    }

    if (action === 'verify') {
        if (token === AUTH_TOKEN) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid session' });
        }
    }

    return res.status(400).json({ message: 'Invalid action' });
}
