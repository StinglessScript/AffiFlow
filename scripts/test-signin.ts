import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testSignin() {
  try {
    const email = 'test@affiflow.com'
    const password = 'test123'

    console.log('Testing signin for:', email)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('✅ User found:', user.email)
    console.log('Has password:', !!user.password)
    console.log('Role:', user.role)

    if (!user.password) {
      console.log('❌ No password set')
      return
    }

    // Test password
    const isValid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', isValid ? '✅' : '❌')

    if (isValid) {
      console.log('🎉 Authentication would succeed!')
      console.log('User data that would be returned:')
      console.log({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSignin()
