import { IsDefined, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
//ValidateNested ve Type ile belirttiğimiz her yerde reflect-metadata import edilmelidir.
import 'reflect-metadata';

class Parameters {
    @IsDefined()
    @IsNotEmpty()
    transactionId: string;
}
export class GetTransactionDTO {
    @IsDefined()
    @IsObject()
    @ValidateNested()
    @Type(() => Parameters)
    params: Parameters;
}
