import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // web(Next)이 3000을 쓰므로 api는 4000으로 둔다
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
