import express from 'express';
import request from 'request';
import RequestHandler from "./base";

export default class MessagesRequestHandler extends RequestHandler {
    async handler(req: express.Request, res: express.Response) {
        const options = {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          json: req.body // forward the JSON data from the original request
        };

        // make a request to the specified URL with the added header
        const forwardedReq = request.post("https://api.openai.com/v1/chat/completions", options);
        // stream the response from the forwarded request back to the client
        forwardedReq.pipe(res);
    }

    public isProtected() {
        return true;
    }
}
