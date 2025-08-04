import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { runAddGroupFeaturesCron } from 'scripts/add-grouped-features';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  runAddGroupFeaturesCron();
  // Configure CORS
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'https://voxcar-7b14f.web.app',
      'https://voxcar-fe-ska6.vercel.app',
      'https://voxcar-fe-b25k.vercel.app',
      'https://voxcar-fe-gamma.vercel.app',
      'https://voxcar-fe-flax.vercel.app',
      'https://voxcar-fe-iota.vercel.app/',
      'https://voxcar-fe-git-main-voxcars-projects-7c5c37a1.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: true,
  });
  const port = 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
