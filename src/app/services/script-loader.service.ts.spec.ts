import { TestBed } from '@angular/core/testing';

import { ScriptLoaderServiceTs } from './script-loader.service.ts';

describe('ScriptLoaderServiceTs', () => {
  let service: ScriptLoaderServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScriptLoaderServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
