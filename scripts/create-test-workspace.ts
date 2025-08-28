import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestWorkspace() {
  try {
    // Find the test user
    const user = await prisma.user.findUnique({
      where: { email: 'test@affiflow.com' }
    });

    if (!user) {
      console.error('User not found');
      return;
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'Odecor',
        slug: 'odecor',
        description: 'Home decor and lifestyle content',
        users: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });

    console.log('✅ Workspace created:', workspace);
    console.log('🔗 Access at: http://localhost:3000/odecor/dashboard');

  } catch (error) {
    console.error('❌ Error creating workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorkspace();
