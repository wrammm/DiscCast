import { TestBed } from '@angular/core/testing';

import { DiscGolfScore } from './disc-golf-score';

describe('DiscGolfScore', () => {
  let service: DiscGolfScore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiscGolfScore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
