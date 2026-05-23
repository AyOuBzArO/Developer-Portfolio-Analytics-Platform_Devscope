import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user/github-link — returns the signed-in user's linked githubUsername
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { githubUsername: true },
  })

  return NextResponse.json({ githubUsername: user?.githubUsername ?? null })
}

// PATCH /api/user/github-link — link or unlink a GitHub username
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const githubUsername: string | null = body.githubUsername ?? null

  // Validate format if provided
  if (githubUsername !== null) {
    const valid = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(githubUsername)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid GitHub username format' }, { status: 400 })
    }
  }

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: { githubUsername: githubUsername },
    select: { githubUsername: true },
  })

  return NextResponse.json({ githubUsername: updated.githubUsername })
}
