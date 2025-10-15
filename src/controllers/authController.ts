import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { utenteDao } from '../dao';
import { generateToken } from '../utils/jwt';
import { ErrorFactory, ErrorTypes } from '../utils/errorFactory';
import { formatTokenBalance } from '../utils/tokenUtils';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Note: Email and password validation is now handled by validateEmailPassword middleware

        const hashedPassword = await bcrypt.hash(password, 10);

        // Verifica se l'email è già in uso
        const existingUser = await utenteDao.findByEmail(email);
        if (existingUser) {
            return next(ErrorFactory.createError(ErrorTypes.BadRequest, 'Un utente con questa email esiste già.'));
        }

        // Flag demo per consentire auto-registrazione come admin solo se esplicitamente attivato
        const allowAdminSelfRegister = process.env.DEMO_ALLOW_ADMIN_SELF_REGISTER === 'true';
        const requestedRole = typeof req.body?.ruolo === 'string' ? String(req.body.ruolo) : undefined;
        const finalRole: 'user' | 'admin' = (allowAdminSelfRegister && requestedRole === 'admin') ? 'admin' : 'user';

        const newUser = await utenteDao.create({
            email,
            password: hashedPassword,
            ruolo: finalRole,
            token_rimanenti: 20.00 // Saldo iniziale di esempio
        });

        const userResponse = { 
            id: newUser.id, 
            email: newUser.email, 
            token_rimanenti: formatTokenBalance(newUser.token_rimanenti) 
        };
        res.status(StatusCodes.CREATED).json({
            message: 'Utente registrato con successo',
            user: userResponse
        });

    } catch (error) {

        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Note: Email and password validation is now handled by validateEmailPassword middleware

        const user = await utenteDao.findByEmail(email);
        if (!user) {
            return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Email o password non validi'));
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return next(ErrorFactory.createError(ErrorTypes.Unauthorized, 'Email o password non validi'));
        }

        const payload = { id: user.id, email: user.email, ruolo: user.ruolo };
        const token = generateToken(payload);

        const userResponse = {
            id: user.id,
            email: user.email,
            ruolo: user.ruolo,
            token_rimanenti: formatTokenBalance(user.token_rimanenti)
        };

        res.status(StatusCodes.OK).json({ 
            message: 'Login effettuato con successo',
            token,
            user: userResponse
        });

    } catch (error) {
        next(error);
    }
};
