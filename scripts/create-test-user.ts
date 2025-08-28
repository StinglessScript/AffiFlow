import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const email = 'test@affiflow.com'
    const password = 'test123'
    const name = 'Test User'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('Test user already exists!')
      console.log('Email:', email)
      console.log('Password:', password)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create test user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER'
      }
    })

    console.log('Test user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role:', user.role)

  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()
