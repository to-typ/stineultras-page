import jwt from "jsonwebtoken";

export function verify(token: string | null): boolean {
    if (!token) {
        return false;
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET as string);
        return true;
    } catch (error) {
        return false;
    }
}