import { NextFunction, Request, Response } from 'express';
import DTOValidator from '../helpers/DTOValidator';
import { ServiceResponse } from '../helpers/ServiceResponse';

export const Validation = (DTO: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        console.info('Request:', req);
        const validatorCheck = await DTOValidator(DTO, req);
        console.info('Validator check:', validatorCheck);
        if (validatorCheck) {
            console.info('Validation error:', validatorCheck);
            res.json(new ServiceResponse({ status: false, statusCode: 400, error: validatorCheck }).get()).status(400);
        } else {
            next();
        }
    };
};
