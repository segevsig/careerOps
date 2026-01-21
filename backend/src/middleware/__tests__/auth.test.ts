import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, generateToken, AuthRequest } from '../auth';

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', () => {
      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access token required',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is missing', () => {
      mockRequest.headers = {};
      
      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if token is valid', () => {
      const mockDecoded = { userId: 1 };
      (jwt.verify as jest.Mock) = jest.fn((token, secret, callback) => {
        callback(null, mockDecoded);
      });

      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.userId).toBe(1);
    });

    it('should return 403 if token is invalid', () => {
      (jwt.verify as jest.Mock) = jest.fn((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a token for a user ID', () => {
      const mockToken = 'generated-token';
      (jwt.sign as jest.Mock) = jest.fn(() => mockToken);

      const token = generateToken(1);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        expect.any(String),
        { expiresIn: '7d' }
      );
    });
  });
});
