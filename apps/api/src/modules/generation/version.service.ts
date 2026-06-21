import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

/**
 * Project & version management (plan §2C).
 * Tracks parent-child job relationships for re-generate / A-B comparison.
 */

export interface VersionSummary {
  jobId: string;
  version: number;
  status: string;
  creditCost: number;
  errorCode?: string | null;
  createdAt: string;
  isLatest: boolean;
}

@Injectable()
export class VersionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Return the version tree rooted at parentJobId.
   * If parentJobId is not provided, find the root.
   */
  async getVersionTree(jobId: string): Promise<{ root: string; versions: VersionSummary[] }> {
    // Walk up to find root
    const current = await this.prisma.generationJob.findUnique({ where: { id: jobId } });
    if (!current) throw new NotFoundException({ code: "NOT_FOUND", message: "任务不存在。" });

    let root = current;
    while (root.parentJobId) {
      const parent = await this.prisma.generationJob.findUnique({ where: { id: root.parentJobId } });
      if (!parent) break;
      root = parent;
    }

    // Collect all descendants of root
    const all = await this.prisma.generationJob.findMany({
      where: {
        OR: [
          { id: root.id },
          { parentJobId: root.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Also get grandchildren
    const descendantIds = all.map((j) => j.id);
    const grandchildren = await this.prisma.generationJob.findMany({
      where: { parentJobId: { in: descendantIds } },
      orderBy: { createdAt: "asc" },
    });

    const allVersions = [...all, ...grandchildren].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const versions: VersionSummary[] = allVersions.map((j, i) => ({
      jobId: j.id,
      version: i + 1,
      status: j.status,
      creditCost: j.creditCost,
      errorCode: j.errorCode,
      createdAt: j.createdAt.toISOString(),
      isLatest: i === allVersions.length - 1,
    }));

    return { root: root.id, versions };
  }

  /** Compare two versions side by side (for A-B comparison UI). */
  async compareVersions(jobIdA: string, jobIdB: string) {
    const [a, b] = await Promise.all([
      this.prisma.generationJob.findUnique({ where: { id: jobIdA } }),
      this.prisma.generationJob.findUnique({ where: { id: jobIdB } }),
    ]);

    return {
      a: a ? { id: a.id, status: a.status, creditCost: a.creditCost, errorCode: a.errorCode, createdAt: a.createdAt, inputParams: a.inputParams } : null,
      b: b ? { id: b.id, status: b.status, creditCost: b.creditCost, errorCode: b.errorCode, createdAt: b.createdAt, inputParams: b.inputParams } : null,
    };
  }
}
