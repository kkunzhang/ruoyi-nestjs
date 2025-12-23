import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
    getHello(): string {
        return 'RuoYi NestJS API is running!';
    }
}



