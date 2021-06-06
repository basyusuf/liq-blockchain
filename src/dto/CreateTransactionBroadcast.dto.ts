import { IsDefined, IsNotEmpty, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
//ValidateNested ve Type ile belirttiğimiz her yerde reflect-metadata import edilmelidir.
import 'reflect-metadata';

class Body {
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
}
export class CreateTransactionBroadcastDTO {
    @IsDefined()
    @IsObject()
    @ValidateNested()
    @Type(() => Body)
    body: Body;
}
