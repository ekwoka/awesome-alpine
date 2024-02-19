use aws_lambda_events::event::apigw::{ApiGatewayProxyRequest, ApiGatewayProxyResponse};
use aws_lambda_events::encodings::Body;
use http::header::HeaderMap;
use lambda_runtime::{service_fn, Error, LambdaEvent};
use log::LevelFilter;
use simple_logger::SimpleLogger;
include!(concat!(env!("OUT_DIR"), "/templates.rs"));
use crate::templates::*;
use std::io;

fn r2s<Call>(call: Call) -> String
where
    Call: FnOnce(&mut Vec<u8>) -> io::Result<()>,
{
    let mut buf = Vec::new();
    call(&mut buf).unwrap();
    String::from_utf8(buf).unwrap()
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    SimpleLogger::new().with_utc_timestamps().with_level(LevelFilter::Info).init().unwrap();

    let func = service_fn(my_handler);
    lambda_runtime::run(func).await?;
    Ok(())
}

pub(crate) async fn my_handler(event: LambdaEvent<ApiGatewayProxyRequest>) -> Result<ApiGatewayProxyResponse, Error> {
    let path = event.payload.path.unwrap();
    let pathquery = event.payload.query_string_parameters.first("path").unwrap();

    let html = r2s(|o| hello_html(o, &pathquery));

    let resp = ApiGatewayProxyResponse {
        status_code: 200,
        headers: HeaderMap::new(),
        multi_value_headers: HeaderMap::new(),
        body: Some(Body::Text(html)),
        is_base64_encoded: Some(false),
    };

    Ok(resp)
}
