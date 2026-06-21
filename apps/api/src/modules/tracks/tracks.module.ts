import { Module } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { TracksService } from "./tracks.service";
import { MediaModule } from "../media/media.module";

@Module({
  imports: [MediaModule],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule {}
