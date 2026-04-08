import { styled } from '@mochi-css/vanilla-react'
import { css } from '@mochi-css/vanilla'

const bannerBase = css({
    background: '#0d0d0f',
    display: 'flex',
    alignItems: 'stretch',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: "'IBM Plex Mono', monospace",
})

export const BannerStandard = styled('div', bannerBase, {
    width: 1280,
    height: 640,
    flexShrink: 0,
})

export const BannerWide = styled('div', bannerBase, {
    width: '100%',
    maxWidth: 2560,
    aspectRatio: '4 / 1',
})

export const LeftSection = styled('div', {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '0 0 0 7%',
    zIndex: 2,
    position: 'relative',
})

export const Wordmark = styled('div', {
    fontFamily: "'IBM Plex Mono', monospace",
    fontWeight: 700,
    fontSize: 'clamp(30px, 7.2vw, 88px)',
    color: '#e8e0cc',
    lineHeight: 1,
    '& span': {
        color: '#c9a84c',
        fontWeight: 300,
        fontSize: '0.42em',
        letterSpacing: '0.05em',
        verticalAlign: 'middle',
        paddingLeft: '0.12em',
    },
})

export const Rule = styled('div', {
    width: 'clamp(36px, 6.5vw, 72px)',
    height: 1,
    background: '#c9a84c',
    margin: 'clamp(13px, 2.3vw, 26px) 0',
    opacity: 0.5,
})

export const Tagline = styled('div', {
    fontWeight: 300,
    fontSize: 'clamp(8px, 1.05vw, 13px)',
    color: '#5a5040',
    letterSpacing: '0.12em',
    lineHeight: 2,
    textTransform: 'uppercase',
    '& strong': {
        color: '#c9a84c',
        fontWeight: 400,
    },
})

export const RightSection = styled('div', {
    width: '44%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 2,
    '& svg': {
        width: '100%',
        height: '100%',
    },
})

export const MiddleSection = styled('div', {
    width: '28%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 2,
    overflow: 'visible',
})

export const VertText = styled('div', {
    position: 'absolute',
    top: '50%',
    right: '3%',
    transform: 'translateY(-50%)',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontWeight: 300,
    fontSize: 'clamp(18px, 2.1vw, 27px)',
    color: '#c9a84c',
    writingMode: 'vertical-rl',
    letterSpacing: '0.25em',
    zIndex: 3,
    opacity: 0.25,
})

export const JpVertLeft = styled('div', {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontWeight: 300,
    fontSize: 'clamp(15.8px, 2.06vw, 25.3px)',
    color: '#6b5e3a',
    writingMode: 'vertical-rl',
    letterSpacing: '0.2em',
    marginRight: 'clamp(4px, 0.8vw, 10px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingTop: '0.25em',
})
