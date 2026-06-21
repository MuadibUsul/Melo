import { Global, Module } from "@nestjs/common";
import { ShowcaseCatalogService } from "./showcase-catalog.service";

@Global()
@Module({
  providers: [ShowcaseCatalogService],
  exports: [ShowcaseCatalogService],
})
export class ShowcaseCatalogModule {}

