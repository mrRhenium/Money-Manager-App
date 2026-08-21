"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert } from "antd";
import { signIn } from "next-auth/react";
import { MailOutlined, LockOutlined, UserOutlined, WalletOutlined, PhoneOutlined, KeyOutlined, ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const handleRegister = async (values: any) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          mobile: values.mobile,
          password: values.password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.step === "verify_otp") {
        setEmail(values.email);
        setPassword(values.password);
        setSuccess("An OTP has been sent to your email to verify your account.");
        setStep(2);
      } else {
        setError(data.message || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: values.otp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Account verified successfully! Logging you in...");
        
        const signInResult = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (signInResult?.ok && !signInResult?.error) {
          router.push("/");
          router.refresh();
        } else {
          setError("Failed to login automatically. Redirecting to login page...");
          setTimeout(() => {
            router.push("/login?registered=true");
          }, 2000);
        }
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError("An unexpected error occurred during verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative">
      {step === 2 && (
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => setStep(1)}
          style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}
        >
          Back to Registration
        </Button>
      )}

      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 10px 15px -3px hsla(var(--primary), 0.2)' }}>
          {step === 1 ? <WalletOutlined style={{ fontSize: '32px' }} /> : <KeyOutlined style={{ fontSize: '32px' }} />}
        </div>
        <Title level={2} style={{ margin: 0 }}>
          {step === 1 ? "Create Account" : "Verify Email"}
        </Title>
        <Text type="secondary">
          {step === 1 ? "Join us to start managing your finances" : "Enter the verification code sent to your email"}
        </Text>
      </div>

      <Card 
        className="w-full max-w-[420px] rounded-2xl shadow-xl"
        bordered={false}
      >
        {step === 1 ? (
          <Form
            name="register_form"
            layout="vertical"
            onFinish={handleRegister}
            size="large"
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
              label="Mobile Number"
              name="mobile"
              rules={[
                { required: true, message: 'Please enter your mobile number!' },
                { pattern: /^[0-9]{10}$/, message: 'Please enter a valid 10-digit mobile number!' }
              ]}
            >
              <Input prefix={<PhoneOutlined className="site-form-item-icon text-gray-400" />} placeholder="Enter 10-digit mobile number" maxLength={10} />
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
        ) : (
          <Form
            form={form}
            name="verify_otp_form"
            layout="vertical"
            onFinish={handleVerifyOtp}
            size="large"
          >
            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}
            {success && (
              <Form.Item>
                <Alert message={success} type="success" showIcon />
              </Form.Item>
            )}

            <div className="flex flex-col items-center justify-center mb-6">
              <span className="mb-2 text-sm text-foreground">Type your 6 digits OTP</span>
              <Form.Item
                name="otp"
                rules={[{ required: true, message: 'Please enter the 6-digit OTP!' }]}
                style={{ margin: 0 }}
              >
                <Input.OTP length={6} size="large" />
              </Form.Item>
            </div>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
                Verify Account
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
