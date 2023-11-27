import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import { Button, Typography, Fab } from "@mui/material";
import { Dialog, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import CloseIcon from '@mui/icons-material/Close';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { BASE_URL } from '../config';
import storage from '../utils/storage';
import ApiFrames from '../services/apiFrames';
import { useMediaQuery } from '@mui/material';

interface Props {
    sources: string[];
    timecode: number;
    videoMlRef: any;
    classId: number;
    timecodeOrig: number;
    updateTimecodeOrig: (newTimecodeOrig: string) => void;
    frameId: number;
}

const classDict: { [index: number]: string } = {
    1: 'Воздушные шарики/игрушки',
    2: 'Торговая тележка/палатка',
    3: 'Продавец',
}

export default function FrameCard(props: Props) {
    const { timecode, videoMlRef, classId, timecodeOrig, updateTimecodeOrig, sources, frameId } = props;

    function formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor((seconds % 3600) % 60);

        const hDisplay = h > 0 ? (h < 10 ? '0' + h : h) + ':' : '';
        const mDisplay = m > 0 ? (m < 10 ? '0' + m : m) + ':' : '00:';
        const sDisplay = s > 0 ? (s < 10 ? '0' + s : s) : '00';
        return hDisplay + mDisplay + sDisplay;
    }


    function handleTimecode() {
        if (videoMlRef.current) {
            videoMlRef.current.currentTime = timecode;
            videoMlRef.current.pause();
        }
    }

    function handleTimecodeOrig() {
        updateTimecodeOrig(String(timecodeOrig))
    }

    const [open, setOpen] = useState(false);
    const [openRejectDialog, setOpenRejectDialog] = useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    function handleRejectButton(){
        if(frameId){
            ApiFrames.putRejectFrames(frameId);
        }
        setOpenRejectDialog(false);
    }

    const isMobile = useMediaQuery('(max-width:1100px)');
    const isTablet = useMediaQuery('(min-width:600px) and (max-width:1200px)');

    return (
        <>
            <Card sx={{ maxWidth: isTablet ? '50%' : isMobile ? '100%' : '910px', boxShadow: '0px 0px 10px 5px rgba(0,0,0,0.1)', borderRadius: '15px', mt: 2, mb: 10, ml: 'auto', mr: 'auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }} >
                <CardMedia
                    sx={{ width: '100%', aspectRatio: isMobile ? '4/3' : '16/9', position: 'relative' }}
                    title="detected object"
                >
                    <Carousel showThumbs={false}>
                        {sources.map((source, index) => (
                            <div key={index}>
                                <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object ${index + 1}`} />
                                {/* <ImageHeader 
                                src={`${BASE_URL}/${source}?token=${storage.getToken()}`}
                                alt={`detected object ${index + 1}`}
                                headers={{ 'ngrok-skip-browser-warning': 'lets go'}} 
                                /> */}
                            </div>
                        ))}
                    </Carousel>
                    <Fab color="secondary" aria-label="open" onClick={handleClickOpen} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <ZoomOutMapIcon />
                    </Fab>
                </CardMedia>
                <CardContent style={{ width: '50%' }}>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 700,
                            fontSize: '15px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            paddingRight: 2,
                        }}
                    >
                        Обнаруженный объект
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 400,
                            fontSize: '15px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            paddingRight: 2,
                        }}
                    >
                        из класса:
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 400,
                            fontSize: '25px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            paddingRight: 2,
                            marginTop: 2
                        }}
                    >
                        {classDict[classId]}
                    </Typography>
                    <Button sx={{ mt: 1 }} onClick={() => { setOpenRejectDialog(true) }}
                        style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: '#DFDFED', borderRadius: '8px', textTransform: 'none' }}>
                        Отметить ложную детекцию
                    </Button>
                </CardContent>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-around', flexDirection: 'column' }}>
                    <CardActions>
                        <Typography
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontWeight: 700,
                                fontSize: '15px',
                                color: '#0B0959',
                                textDecoration: 'none',
                                marginRight: 0,
                                paddingRight: 2,
                            }}
                        >
                            Просмотреть на обработанном видео
                        </Typography>
                        <Button onClick={() => {
                            handleTimecode();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                            style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                        >{formatTime(timecode)}</Button>
                    </CardActions>
                    <CardActions>
                        <Typography
                            sx={{
                                fontFamily: 'Nunito Sans',
                                fontWeight: 700,
                                fontSize: '15px',
                                color: '#0B0959',
                                textDecoration: 'none',
                                marginRight: 0,
                                paddingRight: 2,
                            }}
                        >
                            Просмотреть на оригинальном видео
                        </Typography>
                        <Button onClick={() => {
                            handleTimecodeOrig();
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                            style={{ color: 'white', fontFamily: 'Nunito Sans', backgroundColor: '#0B0959', borderRadius: '8px', textTransform: 'capitalize' }}
                        >{formatTime(timecodeOrig)}</Button>
                    </CardActions>
                </CardContent>
            </Card>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
            >
                <DialogContent>
                    <Carousel showThumbs={false}>
                        {sources.map((source, index) => (
                            <div key={index}>
                                <img src={`${BASE_URL}/${source}?token=${storage.getToken()}`} alt={`detected object ${index + 1}`} style={{ width: '100%', height: 'auto' }} />
                                {/* <ImageHeader 
                                src={`${BASE_URL}/${source}?token=${storage.getToken()}`}
                                alt={`detected object ${index + 1}`} 
                                headers={{ 'ngrok-skip-browser-warning': 'lets go'}} 
                                style={{ width: '100%', height: 'auto' }}
                                /> */}
                            </div>
                        ))}
                    </Carousel>
                    <Fab color="secondary" aria-label="close" onClick={handleClose} style={{ position: 'absolute', right: 10, top: 10 }}>
                        <CloseIcon />
                    </Fab>
                </DialogContent>
            </Dialog>
            <Dialog
                open={openRejectDialog}
                onClose={() => { setOpenRejectDialog(false) }}>
                <DialogContent>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 700,
                            fontSize: '15px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            paddingRight: 2,
                        }}
                    >
                        Вы точно хотите отметить этот кадр, как ложную детекцию? 
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: 'Nunito Sans',
                            fontWeight: 700,
                            fontSize: '15px',
                            color: '#0B0959',
                            textDecoration: 'none',
                            marginRight: 0,
                            paddingRight: 2,
                        }}
                    >
                        
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                        onClick={() => {setOpenRejectDialog(false)}}>Закрыть</Button>
                        <Button style={{ color: '#0B0959', fontFamily: 'Nunito Sans', backgroundColor: 'white', borderRadius: '8px' }}
                        onClick={handleRejectButton}>Да</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}