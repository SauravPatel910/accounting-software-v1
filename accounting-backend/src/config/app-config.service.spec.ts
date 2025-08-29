import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { AppConfigService } from "../app-config.service";
import {
  appConfig,
  databaseConfig,
  supabaseConfig,
  jwtConfig,
  securityConfig,
  emailConfig,
  fileUploadConfig,
  businessConfig,
} from "../config";

describe("AppConfigService", () => {
  let service: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            appConfig,
            databaseConfig,
            supabaseConfig,
            jwtConfig,
            securityConfig,
            emailConfig,
            fileUploadConfig,
            businessConfig,
          ],
        }),
      ],
      providers: [AppConfigService],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should provide app configuration", () => {
    const appConf = service.app;
    expect(appConf).toBeDefined();
    expect(appConf.nodeEnv).toBeDefined();
    expect(appConf.port).toBeGreaterThan(0);
  });

  it("should provide database configuration", () => {
    const dbConf = service.database;
    expect(dbConf).toBeDefined();
    expect(dbConf.host).toBeDefined();
    expect(dbConf.port).toBeGreaterThan(0);
  });

  it("should provide business configuration", () => {
    const businessConf = service.business;
    expect(businessConf).toBeDefined();
    expect(businessConf.defaultCurrency).toBeDefined();
    expect(businessConf.decimalPrecision).toBeGreaterThanOrEqual(0);
  });

  it("should provide convenience methods", () => {
    expect(typeof service.isDevelopment).toBe("boolean");
    expect(typeof service.isProduction).toBe("boolean");
    expect(typeof service.port).toBe("number");
    expect(Array.isArray(service.corsOrigins)).toBe(true);
  });
});
