import { NextResponse } from 'next/server';
import { authOptions } from '../config/auth.config';
import { getServerSession } from 'next-auth/next';
// import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    // // Check if user already exists
    // const existingUser = await prisma.user.findUnique({
    //   where: { email },
    // });

    // if (existingUser) {
    //   return NextResponse.json(
    //     { message: 'User already exists' },
    //     { status: 400 }
    //   );
    // }

    // // In a real app, you would hash the password here
    // // For now, we'll store it as is (NOT RECOMMENDED FOR PRODUCTION)
    // const newUser = await prisma.user.create({
    //   data: {
    //     name,
    //     email,
    //     password, // In production, hash this password
    //   },
    // });

    // Return the user without the password
    // const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json({
      // user: userWithoutPassword,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Error creating user' },
      { status: 500 }
    );
  }
}

export { authOptions as GET };
