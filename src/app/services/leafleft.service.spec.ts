import { TestBed } from '@angular/core/testing';

import { LeafleftService } from './leafleft.service';

describe('LeafleftService', () => {
  let service: LeafleftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeafleftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
