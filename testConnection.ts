import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    const events = await prisma.event.findMany()
    console.log("Fetched events:", events)
    console.log("Total events:", events.length)
  } catch (err) {
    console.error("Error:", err)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
