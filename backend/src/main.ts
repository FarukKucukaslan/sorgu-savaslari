import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS'u aktif et (Expo uygulaması için)
  app.enableCors({
    origin: '*', // Geliştirme için; production'da spesifik origin kullan
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
