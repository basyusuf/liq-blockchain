import { IsDefined, IsNotEmpty, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
//ValidateNested ve Type ile belirttiğimiz her yerde reflect-metadata import edilmelidir.
import 'reflect-metadata';

class Body {
    @IsDefined()
    @IsNotEmpty()
    @IsString()
    id: string;

    @IsDefined()
    @IsNotEmpty()
    @IsNumber()
    amount: number;

    @IsDefined()
    @IsNotEmpty()
    @IsString()
    sender: string;

    @IsDefined()
    @IsNotEmpty()
    @IsString()
    recipient: string;

    @IsDefined()
    @IsNotEmpty()
    @IsNumber()
    timestamp: number;
}
export class CreateTransactionDTO {
    @IsDefined()
    @IsObject()
    @ValidateNested()
    @Type(() => Body)
    body: Body;
}
