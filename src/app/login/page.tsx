"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert, Space } from "antd";
import { MailOutlined, LockOutlined, StarOutlined } from "@ant-design/icons";

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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto bg-[#0ea5e9] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#0ea5e9]/20">
          <StarOutlined style={{ fontSize: '32px' }} />
        </div>
        <Title level={2} style={{ margin: 0 }}>Welcome Back</Title>
        <Text type="secondary">Sign in to manage your finances</Text>
      </div>

      <Card 
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}
        bordered={false}
      >
        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          size="large"
          requiredMark={false}
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
            <Input prefix={<MailOutlined className="site-form-item-icon text-gray-400" />} placeholder="name@example.com" />
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>Password</span>
                <Link href="/forgot-password" style={{ fontSize: '14px', fontWeight: 500, color: '#0ea5e9' }} tabIndex={-1}>
                  Forgot password?
                </Link>
              </div>
            }
            name="password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
              Sign In
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Don't have an account? <Link href="/register" style={{ fontWeight: 600, color: '#0ea5e9' }}>Sign up</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
