"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert } from "antd";
import { MailOutlined, LockOutlined, UserOutlined, StarOutlined } from "@ant-design/icons";

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
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto bg-[#0ea5e9] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#0ea5e9]/20">
          <StarOutlined style={{ fontSize: '32px' }} />
        </div>
        <Title level={2} style={{ margin: 0 }}>Create Account</Title>
        <Text type="secondary">Join us to start managing your finances</Text>
      </div>

      <Card 
        style={{ width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}
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
            <Input prefix={<UserOutlined className="site-form-item-icon text-gray-400" />} placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            label="Email address"
            name="email"
            rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input prefix={<MailOutlined className="site-form-item-icon text-gray-400" />} placeholder="name@example.com" />
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
              Already have an account? <Link href="/login" style={{ fontWeight: 600, color: '#0ea5e9' }}>Sign in</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
