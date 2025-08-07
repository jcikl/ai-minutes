"use client"

import { useState, useEffect } from "react"
import { onAuthStateChanged, User, signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/config"
import { Loader2, UserIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// 简单的登录页面组件
const LoginPage = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnonymousLogin = async () => {
    setIsLoggingIn(true)
    setError(null)
    
    try {
      console.log("尝试匿名登录...")
      const result = await signInAnonymously(auth)
      console.log("匿名登录成功:", result.user)
    } catch (error: any) {
      console.error("匿名登录失败:", error)
      setError(error.message || "登录失败，请重试")
      setIsLoggingIn(false)
    }
  }

  // 跳过认证的按钮（用于测试）
  const handleSkipAuth = () => {
    // 创建一个模拟用户对象
    const mockUser = { uid: 'test-user', email: 'test@example.com' } as User
    setIsLoggingIn(false)
    // 这里我们直接设置用户状态，跳过真正的认证
    window.location.href = '/meeting'
  }

  return (
    <div className="flex h-screen items-center justify-center bg-bg-primary p-4">
      <Card className="w-full max-w-md border-none bg-bg-secondary text-text-primary shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-english-color">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">AI 会议转录系统</CardTitle>
          <p className="text-text-secondary">请登录以使用实时转录功能</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleAnonymousLogin}
            disabled={isLoggingIn}
            className="w-full bg-english-color hover:bg-english-color/90 text-white"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              <>
                <UserIcon className="mr-2 h-4 w-4" />
                匿名登录
              </>
            )}
          </Button>
          
          {/* 临时测试按钮 */}
          <Button 
            onClick={handleSkipAuth}
            variant="outline"
            className="w-full border-processing-color text-processing-color hover:bg-processing-color/10"
          >
            跳过登录（测试模式）
          </Button>
          
          {error && (
            <div className="rounded-md bg-recording-color/10 p-3 text-recording-color">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-text-secondary">
              点击任一按钮即可开始使用会议转录功能
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Placeholder for a loading spinner
const LoadingSpinner = () => (
  <div className="flex h-screen items-center justify-center bg-bg-primary">
    <Loader2 className="h-8 w-8 animate-spin text-english-color" />
  </div>
)

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}
