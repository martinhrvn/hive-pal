import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { HiveModule } from './hives/hive.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, HiveModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
