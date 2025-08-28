import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@affiflow.com' }
    })

    if (admin) {
      console.log('Admin user found:')
      console.log('ID:', admin.id)
      console.log('Email:', admin.email)
      console.log('Name:', admin.name)
      console.log('Role:', admin.role)
      console.log('Has password:', !!admin.password)
      
      // Test password
      if (admin.password) {
        const isValid = await bcrypt.compare('admin123', admin.password)
        console.log('Password valid:', isValid)
      }
    } else {
      console.log('Admin user not found!')
      
      // Create admin user
      console.log('Creating admin user...')
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'admin@affiflow.com',
          name: 'Admin User',
          password: hashedPassword,
          role: 'SUPER_ADMIN'
        }
      })
      
      console.log('Admin user created:', newAdmin.email)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()
