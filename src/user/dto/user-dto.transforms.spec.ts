import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminUserQueryDto } from './adminQuery.dto';
import { ChangeEmailDto } from './changeEmail.dto';
import { PaginationDto } from './pagination.dto';
import { RegisterUserDto } from './register.dto';
import { SearchUserDto } from './search.dto';

describe('User DTO transforms and validation', () => {
  it('normaliza email en RegisterUserDto', () => {
    const dto = plainToInstance(RegisterUserDto, {
      email: ' ANA@EXAMPLE.COM ',
      password: 'Password1',
      fullName: 'Ana',
    });

    expect(dto.email).toBe('ana@example.com');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('normaliza newEmail en ChangeEmailDto', () => {
    const dto = plainToInstance(ChangeEmailDto, {
      currentPassword: 'Password1',
      newEmail: ' NEW@EXAMPLE.COM ',
    });

    expect(dto.newEmail).toBe('new@example.com');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('convierte limit y skip a numeros en PaginationDto', () => {
    const dto = plainToInstance(PaginationDto, {
      limit: '50',
      skip: '10',
    });

    expect(dto.limit).toBe(50);
    expect(dto.skip).toBe(10);
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('valida limites invalidos de paginacion', () => {
    const dto = plainToInstance(PaginationDto, {
      limit: '101',
      skip: '-1',
    });

    expect(validateSync(dto)).toHaveLength(2);
  });

  it('transforma booleanos y limpia busqueda en AdminUserQueryDto', () => {
    const dto = plainToInstance(AdminUserQueryDto, {
      isActive: 'false',
      search: '  ana  ',
    });

    expect(dto.isActive).toBe(false);
    expect(dto.search).toBe('ana');
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('normaliza email en SearchUserDto', () => {
    const dto = plainToInstance(SearchUserDto, {
      email: ' USER@EXAMPLE.COM ',
      fullName: 'Usuario',
    });

    expect(dto.email).toBe('user@example.com');
    expect(validateSync(dto)).toHaveLength(0);
  });
});
