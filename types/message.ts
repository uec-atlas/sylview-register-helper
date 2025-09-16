export type RequestInfoMessage = {
  type: "requestInfo";
  data?: never;
};

export type ResponseInfoMessage = {
  type: "responseInfo";
  data: {
    grade: number;
    term: string;
    department: string;
    period: string;
  };
};

export type RequestInputCodeMessage = {
  type: "requestInputCode";
  data: {
    timeTableCode: string;
  };
};

export type Message =
  | RequestInfoMessage
  | ResponseInfoMessage
  | RequestInputCodeMessage;
