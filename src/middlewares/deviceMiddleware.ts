import { RequestHandler } from 'express';
import { UAParser } from 'ua-parser-js';

import { AppRequest } from '../types/types';

export const deviceMiddleware: RequestHandler = (req: AppRequest, resp, next) => {
    const deviceId = req.headers['x-device-id'];
    const platform = req.headers['x-platform'];
    console.log('req.params', req.params);
    console.log('req.query', req.query);
    console.log('req.cookies', req.cookies);

    //TODO: Uncomment the following code block after adding the required headers

    // Validate the presence of required headers
    /* if (!deviceId || deviceId.length === 0) {
      res.status(400).json({
          error: "Missing 'x-device-id' in request headers",
      });
      return;
  }
  if (!platform || platform.length === 0) {
      res.status(400).json({
          error: "Missing 'x-platform' in request headers",
      });
      return;
  }*/

    const ua = UAParser(req.headers['user-agent']);

    const ip = req.ip || req.ips[0];

    // Attach headers to the request object
    req.deviceInfo = {
        deviceId: deviceId,
        ip,
        ...ua,
    };

    next();
};
