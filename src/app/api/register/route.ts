import { NextResponse } from 'next/server';

import { getConfig, setCachedConfig } from '@/lib/config';
import { db } from '@/lib/db';

// 用户名验证规则
function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 20) {
    return '用户名长度必须在3-20个字符之间';
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return '用户名只能包含字母、数字、下划线和短横线';
  }
  return null;
}

// 密码验证规则
function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return '密码长度至少6个字符';
  }
  if (password.length > 128) {
    return '密码长度不能超过128个字符';
  }
  return null;
}

// 注册码验证规则
function validateRegistrationCode(code: string): string | null {
  if (!code || code.trim().length === 0) {
    return '注册码不能为空';
  }
  // UUID 格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(code)) {
    return '注册码格式无效';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { username, password, registration_code } = await req.json();

    // 参数验证
    if (!username || !password || !registration_code) {
      return NextResponse.json(
        { error: '用户名、密码和注册码都是必填项' },
        { status: 400 }
      );
    }

    // 格式验证
    const usernameError = validateUsername(username);
    if (usernameError) {
      return NextResponse.json({ error: usernameError }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const codeError = validateRegistrationCode(registration_code);
    if (codeError) {
      return NextResponse.json({ error: codeError }, { status: 400 });
    }

    // 检查用户是否已存在
    const existingUser = await db.checkUserExist(username);
    if (existingUser) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 验证注册码
    const code = await db.getRegistrationCode(registration_code);
    if (!code || code.status !== 'unused') {
      return NextResponse.json(
        { error: '无效的注册码或注册码已被使用' },
        { status: 400 }
      );
    }

    // 创建用户
    await db.registerUser(username, password);

    // 更新管理员配置，添加新用户到用户列表
    const adminConfig = await getConfig();
    const newUser = {
      username: username,
      role: 'user' as const,
      banned: false,
    };
    adminConfig.UserConfig.Users.push(newUser);
    await db.saveAdminConfig(adminConfig);
    await setCachedConfig(adminConfig);

    // 更新注册码状态
    code.status = 'used';
    code.used_at = new Date().toISOString();
    code.used_by_user_id = username; // 暂时使用用户名作为标识
    await db.updateRegistrationCode(code);

    return NextResponse.json({
      success: true,
      message: '注册成功，请登录'
    });
  } catch (error) {
    // 注册失败，记录错误
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}