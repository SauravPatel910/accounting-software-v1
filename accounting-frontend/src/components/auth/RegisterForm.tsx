import { useState } from "react";
// prettier-ignore
import { TextInput, PasswordInput, Paper, Title, Text, Container, Button, Group, Anchor, Stack, Alert } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconInfoCircle, IconCheck } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

interface RegisterFormProps {
  onToggleForm: () => void;
}

export function RegisterForm({ onToggleForm }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();

  const form = useForm<RegisterFormData>({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      companyName: "",
    },
    validate: {
      email: (val) => (/^\S+@\S+$/.test(val) ? null : "Invalid email"),
      password: (val) => (val.length < 6 ? "Password must be at least 6 characters" : null),
      confirmPassword: (val, values) => (val !== values.password ? "Passwords do not match" : null),
      firstName: (val) => (val.length < 2 ? "First name must be at least 2 characters" : null),
      lastName: (val) => (val.length < 2 ? "Last name must be at least 2 characters" : null),
      companyName: (val) => (val.length < 2 ? "Company name must be at least 2 characters" : null),
    },
  });

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    setError(null);

    const { error } = await signUp(values.email, values.password, {
      data: {
        first_name: values.firstName,
        last_name: values.lastName,
        company_name: values.companyName,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Alert icon={<IconCheck size="1rem" />} title="Registration Successful!" color="green">
            Please check your email for a verification link to complete your registration.
          </Alert>
          <Button fullWidth mt="xl" onClick={onToggleForm}>
            Back to Login
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title
        style={{
          fontFamily: "Greycliff CF, var(--mantine-font-family)",
          fontWeight: 900,
          textAlign: "center",
        }}>
        Create Account
      </Title>
      <Text c="dimmed" size="sm" style={{ textAlign: "center" }} mt={5}>
        Start managing your accounting today
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            {error && (
              <Alert icon={<IconInfoCircle size="1rem" />} title="Error" color="red">
                {error}
              </Alert>
            )}

            <Group grow>
              <TextInput label="First Name" placeholder="John" required {...form.getInputProps("firstName")} />
              <TextInput label="Last Name" placeholder="Doe" required {...form.getInputProps("lastName")} />
            </Group>

            <TextInput
              label="Company Name"
              placeholder="Your Company Ltd."
              required
              {...form.getInputProps("companyName")}
            />

            <TextInput label="Email" placeholder="your@email.com" required {...form.getInputProps("email")} />

            <PasswordInput label="Password" placeholder="Your password" required {...form.getInputProps("password")} />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              required
              {...form.getInputProps("confirmPassword")}
            />
          </Stack>

          <Group justify="space-between" mt="lg">
            <Anchor component="button" size="sm" onClick={onToggleForm}>
              Already have an account? Sign in
            </Anchor>
          </Group>

          <Button type="submit" fullWidth mt="xl" loading={loading}>
            Create Account
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
