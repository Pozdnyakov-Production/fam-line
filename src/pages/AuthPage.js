import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Tabs, Tab, TextField, Button, Typography, Box, Alert,
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, clearError } from '../store/authSlice';

export default function AuthPage() {
  const [tab, setTab] = useState(0);
  const [loginMethod, setLoginMethod] = useState('phone');
  const dispatch = useDispatch();
  const error = useSelector(state => state.auth.error);

  useEffect(() => {
    dispatch(clearError());
  }, [tab, dispatch]);

  const loginSchema = Yup.object({
    login: Yup.string().required('Введите телефон или логин'),
    password: Yup.string().required('Введите пароль'),
  });

  const registerSchema = Yup.object({
    firstName: Yup.string().required('Имя обязательно'),
    lastName: Yup.string().required('Фамилия обязательна'),
    password: Yup.string().min(4, 'Минимум 4 символа').required('Введите пароль'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Пароли не совпадают')
      .required('Подтвердите пароль'),
  });

  const handleLogin = (values) => dispatch(login(values));
  const handleRegister = (values) => dispatch(register(values));

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 1, color: 'primary.main' }}>
          Family Connect
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Семейный менеджер задач
        </Typography>

        <Tabs value={tab} onChange={(e, v) => setTab(v)} centered sx={{ mb: 3 }}>
          <Tab label="Вход" />
          <Tab label="Регистрация" />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {tab === 0 && (
          <>
            <Box sx={{ mb: 2 }}>
              <Tabs value={loginMethod} onChange={(e, v) => setLoginMethod(v)} centered>
                <Tab label="Телефон" value="phone" />
                <Tab label="Логин" value="username" />
              </Tabs>
            </Box>
            <Formik
              initialValues={{ login: '', password: '' }}
              validationSchema={loginSchema}
              onSubmit={handleLogin}
            >
              {({ values, handleChange, errors, touched }) => (
                <Form>
                  <TextField
                    fullWidth
                    margin="normal"
                    id="login"
                    name="login"
                    label={loginMethod === 'phone' ? 'Номер телефона' : 'Логин'}
                    value={values.login}
                    onChange={handleChange}
                    error={touched.login && !!errors.login}
                    helperText={touched.login && errors.login}
                    type={loginMethod === 'phone' ? 'tel' : 'text'}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="password"
                    name="password"
                    label="Пароль"
                    type="password"
                    value={values.password}
                    onChange={handleChange}
                    error={touched.password && !!errors.password}
                    helperText={touched.password && errors.password}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}>
                    Войти
                  </Button>
                </Form>
              )}
            </Formik>
          </>
        )}

        {tab === 1 && (
          <Formik
            initialValues={{
              firstName: '',
              lastName: '',
              password: '',
              confirmPassword: '',
            }}
            validationSchema={registerSchema}
            onSubmit={handleRegister}
          >
            {({ values, handleChange, errors, touched }) => (
              <Form>
                <TextField
                  fullWidth
                  margin="normal"
                  id="firstName"
                  name="firstName"
                  label="Имя"
                  value={values.firstName}
                  onChange={handleChange}
                  error={touched.firstName && !!errors.firstName}
                  helperText={touched.firstName && errors.firstName}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  id="lastName"
                  name="lastName"
                  label="Фамилия"
                  value={values.lastName}
                  onChange={handleChange}
                  error={touched.lastName && !!errors.lastName}
                  helperText={touched.lastName && errors.lastName}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  id="reg-password"
                  name="password"
                  label="Пароль"
                  type="password"
                  value={values.password}
                  onChange={handleChange}
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Подтверждение пароля"
                  type="password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  error={touched.confirmPassword && !!errors.confirmPassword}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
                <Button type="submit" fullWidth variant="contained" size="large" sx={{ mt: 3 }}>
                  Зарегистрироваться
                </Button>
              </Form>
            )}
          </Formik>
        )}
      </Paper>
    </Container>
  );
}