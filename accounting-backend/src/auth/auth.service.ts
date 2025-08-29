import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateUserProfileDto, UpdateUserProfileDto } from "./dto/user-profile.dto.js";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async createUserProfile(
    userId: string,
    createUserProfileDto: CreateUserProfileDto,
  ): Promise<any> {
    return await this.prisma.userProfile.create({
      data: {
        userId,
        ...createUserProfileDto,
      },
    });
  }

  async getUserProfile(userId: string): Promise<any> {
    return await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        companies: true,
      },
    });
  }

  async updateUserProfile(
    userId: string,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<any> {
    return await this.prisma.userProfile.update({
      where: { userId },
      data: updateUserProfileDto,
    });
  }

  async getUserCompanies(userId: string): Promise<any[]> {
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        companies: true,
      },
    });
    return userProfile?.companies || [];
  }
}
