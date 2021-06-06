import { IsDefined, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
//ValidateNested ve Type ile belirttiğimiz her yerde reflect-metadata import edilmelidir.
import 'reflect-metadata';

class Parameters {
    @IsDefined()
    @IsNotEmpty()
    address: string;
}
export class GetAddressDTO {
    @IsDefined()
    @IsObject()
    @ValidateNested()
    @Type(() => Parameters)
    params: Parameters;
}
