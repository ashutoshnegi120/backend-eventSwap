import bcrypt from "bcrypt";

export const hashPassword = async (plainPassword) => {
    try {
        return await bcrypt.hash(plainPassword, 12);
    } catch (err) {
        throw new Error("Error hashing password: " + err.message);
    }
};


export const verifyPassword = async (plainPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (err) {
        throw new Error("Error verifying password: " + err.message);
    }
};