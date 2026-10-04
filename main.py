import joblib
import pandas as pd
from fastapi import FastAPI
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,Field



model=joblib.load('rf_mental_score_new.pkl')
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



top_countries=['Other',
 'India',
 'USA',
 'Canada',
 'Australia',
 'UK',
 'Germany',
 'Mexico',
 'Turkey','France']

class student(BaseModel):
    age:int=Field(...,le=25,ge=12)
    gender:Literal['Male','Female']
    country:Literal[ 'Other','India','USA','Canada','Australia','UK','Germany','Mexico','Turkey','France']

    academic:Literal['High School','Undergraduate','Graduate']
    stress:Literal['Low','Medium','High','Very High']

    most_used_platform      : Literal['Facebook', 'LinkedIn', 'Instagram', 'Snapchat','Twitter','YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp','WeChat']


    purpose_of_use          : Literal['Networking', 'Education', 'Entertainment', 'News']

    avg_daily_usage_hours   : float = Field(..., ge=0, le=24)
    daily_unlocks           : int   = Field(..., ge=0)
    study_hours             : float = Field(..., ge=0, le=24)
    physical_activity_hours : float = Field(..., ge=0, le=24)
    sleep_hours_per_night   : float = Field(..., ge=0, le=24)


class PredictionResponse(BaseModel):
    predicted_mental_health_score:float



@app.get("/")
def home():
    return{"message":"welcome to my website"}


@app.post("/predict",response_model=PredictionResponse)
def post(data:student):
    
   input_row = pd.DataFrame([{
        'Age'                       :data.age,
        'Gender'                    :data.gender,
        'Country'                   :data.country,
        'Academic_Level'            :data.academic,
        'Most_Used_Platform'        :data.most_used_platform,
        'Purpose_Of_Use'            :data.purpose_of_use,
        'Avg_Daily_Usage_Hours'     :data.avg_daily_usage_hours,
        'Daily_Unlocks'             :data.daily_unlocks,
        'Study_Hours'               :data.study_hours,
        'Physical_Activity_Hours'   :data.physical_activity_hours,
        'Sleep_Hours_Per_Night'     :data.sleep_hours_per_night,
        'Stress_Level'              :data.stress,
        
   }])


   prediction=model.predict(input_row)[0]
   return PredictionResponse(predicted_mental_health_score=round(float(prediction),2))



