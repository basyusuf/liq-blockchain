import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Request } from 'express';

const DTOValidator = async (DTO: any, Req: Request): Promise<any> => {
    console.info('Data to check: ', Req);
    let item: any = {
        body: Req.body,
        params: Req.params,
        method: Req.method,
    };
    const checkedItem = plainToClass(DTO, item);
    console.info('Checked Class:', checkedItem);
    const errorResult = await validate(checkedItem, {});
    console.log('Validation Error Result: ', errorResult);
    // Errors is an array of validation errors
    if (errorResult.length > 0) {
        let errorTexts: Array<any> = [];
        for (let errorItem of errorResult) {
            if (errorItem.constraints) {
                errorTexts = errorTexts.concat(errorItem.constraints);
            }
            if (errorItem.children && errorItem.children.length > 0) {
                errorItem.children.map((childİtem) => {
                    errorTexts = errorTexts.concat(childİtem.constraints);
                });
            }
        }
        return errorTexts;
    } else {
        // Pass DTO object to service
        return null;
    }
};
export default DTOValidator;
