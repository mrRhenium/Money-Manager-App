"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, WalletOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (res.ok) {
        router.push("/login?registered=true");
      } else {
        const data = await res.json();
        setError(data.message || "An error occurred");
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
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 10px 15px -3px hsla(var(--primary), 0.2)' }}>
          <WalletOutlined style={{ fontSize: '32px' }} />
        </div>
        <Title level={2} style={{ margin: 0 }}>Create Account</Title>
        <Text type="secondary">Join us to start managing your finances</Text>
      </div>

      <Card 
        className="w-full max-w-[420px] rounded-2xl shadow-xl"
        bordered={false}
      >
        <Form
          name="register_form"
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
            label="Full Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name!' }]}
          >
            <Input prefix={<UserOutlined className="site-form-item-icon text-gray-400" />} placeholder="Enter name" />
          </Form.Item>

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
            rules={[{ required: true, message: 'Please enter your password!' }, { min: 6, message: 'Password must be at least 6 characters!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 32, marginBottom: 12 }}>
            <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
              Create Account
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Already have an account? <Link href="/login" style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>Sign in</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
