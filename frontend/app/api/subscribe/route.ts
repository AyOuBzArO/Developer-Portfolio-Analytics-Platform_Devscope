import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/subscribe — subscribe an email to weekly digest for a GitHub username
export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json()

    if (!email?.trim() || !username?.trim()) {
      return NextResponse.json(
        { error: 'Email and GitHub username are required.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }

    // Upsert — re-activate if previously unsubscribed
    const sub = await prisma.emailSubscription.upsert({
      where: {
        email_username: {
          email: email.toLowerCase().trim(),
          username: username.toLowerCase().trim(),
        },
      },
      create: {
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        active: true,
      },
      update: { active: true },
    })

    return NextResponse.json(
      { id: sub.id, email: sub.email, username: sub.username },
      { status: 201 }
    )
  } catch (err) {
    console.error('[subscribe]', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE /api/subscribe — unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const { email, username } = await req.json()

    if (!email?.trim() || !username?.trim()) {
      return NextResponse.json({ error: 'Email and username required.' }, { status: 400 })
    }

    await prisma.emailSubscription.updateMany({
      where: {
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
      },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[unsubscribe]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
