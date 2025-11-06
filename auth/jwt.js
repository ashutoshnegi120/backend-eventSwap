import jwt from 'jsonwebtoken';


export function jwtCreate(username) {
        return jwt.sign({username}, process.env.JWT_SECRET_KEY, {expiresIn: '1h'});

}

function jwtDecode(req, token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY)
    } catch (err) {
        return { error: err.message };
    }
}


export function middlewareJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

    const token = authHeader.split(' ')[1];
    const decoded = jwtDecode(req, token);

    if (decoded?.error) {
        return res.status(401).json({ error: decoded.error });
    }

    req.user = decoded;
    next();
}