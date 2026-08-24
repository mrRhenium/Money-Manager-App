"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert, Space } from "antd";
import { MailOutlined, LockOutlined, WalletOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="mb-8 text-center">

        <Title level={2} style={{ margin: 0 }}>Welcome Back</Title>
        <Text type="secondary">Sign in to manage your finances</Text>
      </div>

      <Card 
        className="w-full max-w-[420px] rounded-2xl shadow-xl"
        bordered={false}
      >
        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
        >
          {error && (
            <Form.Item>
              <Alert message={error} type="error" showIcon />
            </Form.Item>
          )}

          <Form.Item
            label="Email address"
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input prefix={<MailOutlined className="site-form-item-icon text-gray-400" />} placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
            style={{ marginBottom: 8 }}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
              placeholder="••••••••"
            />
          </Form.Item>
          
          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link href="/forgot-password" style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--primary))' }} tabIndex={-1}>
              Forgot password?
            </Link>
          </div>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don&apos;t have an account? <Link href="/register" style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>Sign up</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
